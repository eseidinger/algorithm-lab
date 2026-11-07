import { spawn, execFile as execFileCallback } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)
const root = fileURLToPath(new URL('../../..', import.meta.url))
const web = fileURLToPath(new URL('..', import.meta.url))
const init = fileURLToPath(new URL('../../../infra/postgres', import.meta.url))
const container = `algorithm-lab-e2e-${randomUUID()}`
const children = []
const abort = new AbortController()
let containerStarted = false

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => abort.abort(new Error(`Interrupted by ${signal}`)))
}

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    detached: true,
    ...options,
  })
  child.on('error', (error) =>
    console.error(`Failed to start ${command}:`, error),
  )
  children.push(child)
  return child
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(child.exitCode ?? 1)
  }
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}

async function run(command, args, options = {}) {
  const child = start(command, args, options)
  const code = await Promise.race([
    waitForExit(child),
    new Promise((_, reject) =>
      abort.signal.addEventListener(
        'abort',
        () => reject(abort.signal.reason),
        { once: true },
      ),
    ),
  ])
  if (code !== 0) throw new Error(`${command} exited with status ${code}`)
}

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) =>
    server.once('error', reject).listen(0, '127.0.0.1', resolve),
  )
  const port = server.address().port
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  return port
}

async function waitUntil(label, check, child, timeout = 120_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    abort.signal.throwIfAborted()
    if (
      child &&
      (!child.pid || child.exitCode !== null || child.signalCode !== null)
    ) {
      throw new Error(`${label} exited before becoming ready`)
    }
    try {
      if (await check()) return
    } catch {
      // Retry while the service starts.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function stop(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
  const exited = waitForExit(child).catch(() => {})
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
  const timer = setTimeout(() => {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch (error) {
      if (error.code !== 'ESRCH') console.error(error)
    }
  }, 5000)
  await exited
  clearTimeout(timer)
}

try {
  await execFile('docker', [
    'run',
    '-d',
    '--rm',
    '--name',
    container,
    '-e',
    'POSTGRES_DB=algorithm_lab',
    '-e',
    'POSTGRES_USER=postgres',
    '-e',
    'POSTGRES_PASSWORD=postgres_local',
    '-p',
    '127.0.0.1::5432',
    '-v',
    `${init}:/docker-entrypoint-initdb.d:ro`,
    'postgres:18',
  ])
  containerStarted = true
  await waitUntil('PostgreSQL', async () => {
    await execFile('docker', [
      'exec',
      container,
      'pg_isready',
      '-h',
      '127.0.0.1',
      '-U',
      'postgres',
      '-d',
      'algorithm_lab',
    ])
    return true
  })
  const { stdout } = await execFile('docker', ['port', container, '5432/tcp'])
  const pgPort = stdout.trim().match(/:(\d+)$/)?.[1]
  if (!pgPort) throw new Error(`Could not determine PostgreSQL port: ${stdout}`)

  const env = {
    ...process.env,
    PGHOST: '127.0.0.1',
    PGPORT: pgPort,
    PGDATABASE: 'algorithm_lab',
  }
  await run('uv', ['run', 'alembic', 'upgrade', 'head'], {
    cwd: `${root}/apps/algorithm-service`,
    env: { ...env, PGUSER: 'execution_app', PGPASSWORD: 'execution_local' },
  })

  const dataPort = await freePort()
  const apiPort = await freePort()
  const webPort = await freePort()
  const data = start('./gradlew', ['--no-daemon', 'bootRun'], {
    cwd: `${root}/apps/data-service`,
    env: {
      ...env,
      PORT: String(dataPort),
      PGUSER: 'catalog_app',
      PGPASSWORD: 'catalog_local',
    },
  })
  await waitUntil(
    'Spring',
    async () =>
      (await fetch(`http://127.0.0.1:${dataPort}/actuator/health`)).ok,
    data,
  )
  const api = start(
    'uv',
    [
      'run',
      '--package',
      'algorithm-service',
      'uvicorn',
      'algorithm_service.main:app',
      '--host',
      '127.0.0.1',
      '--port',
      String(apiPort),
    ],
    {
      env: {
        ...env,
        PGUSER: 'execution_app',
        PGPASSWORD: 'execution_local',
        DATA_SERVICE_URL: `http://127.0.0.1:${dataPort}`,
      },
    },
  )
  await waitUntil(
    'FastAPI',
    async () => (await fetch(`http://127.0.0.1:${apiPort}/openapi.json`)).ok,
    api,
  )
  const vite = start(
    'npm',
    [
      'run',
      'dev',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
      '--strictPort',
    ],
    {
      cwd: web,
      env: {
        ...env,
        DATA_PROXY_TARGET: `http://127.0.0.1:${dataPort}`,
        ALGORITHMS_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
      },
    },
  )
  await waitUntil(
    'Vite',
    async () =>
      (await fetch(`http://127.0.0.1:${webPort}/api/data/showcases`)).ok,
    vite,
  )
  await run(
    './node_modules/.bin/playwright',
    ['test', ...process.argv.slice(2)],
    {
      cwd: web,
      env: {
        ...env,
        E2E_PGPORT: pgPort,
        E2E_BASE_URL: `http://127.0.0.1:${webPort}`,
      },
    },
  )
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  for (const child of children.reverse()) await stop(child)
  if (containerStarted) {
    try {
      await execFile('docker', ['stop', container])
    } catch (error) {
      console.error('Failed to stop test database:', error)
      process.exitCode = 1
    }
  }
}

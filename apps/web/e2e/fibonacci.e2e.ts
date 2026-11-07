import { test, expect } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))

async function stopWorker(worker: ChildProcess) {
  if (!worker.pid || worker.exitCode !== null || worker.signalCode !== null)
    return
  const exited = new Promise<void>((resolve) =>
    worker.once('exit', () => resolve()),
  )
  worker.kill('SIGTERM')
  const timer = setTimeout(() => worker.kill('SIGKILL'), 5000)
  try {
    await exited
  } finally {
    clearTimeout(timer)
  }
}

test('processes a queued Fibonacci execution after the worker starts', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open showcase' }).click()
  await expect(page.getByText('Input: n = 10')).toBeVisible()
  await page.getByRole('button', { name: 'Run Fibonacci' }).click()
  await expect(page).toHaveURL(/\/executions\/[0-9a-f-]+$/)
  await expect(page.getByText('Status: queued')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Status: queued')).toBeVisible()

  const worker = spawn(
    'uv',
    ['run', '--package', 'algorithm-service', 'algorithm-worker'],
    {
      cwd: root,
      env: {
        ...process.env,
        PGPORT: process.env.E2E_PGPORT,
        PGUSER: 'execution_app',
        PGPASSWORD: 'execution_local',
      },
      stdio: 'inherit',
    },
  )
  try {
    await new Promise<void>((resolve, reject) => {
      worker.once('spawn', resolve)
      worker.once('error', reject)
    })
    await expect(page.getByText('Status: succeeded')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Result: 55')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Status: succeeded')).toBeVisible()
    await expect(page.getByText('Result: 55')).toBeVisible()
  } finally {
    await stopWorker(worker)
  }
})

test('shows an error for an unknown execution', async ({ page }) => {
  await page.goto('/executions/00000000-0000-4000-8000-000000000099')
  await expect(page.getByText('Execution not found.')).toBeVisible()
})

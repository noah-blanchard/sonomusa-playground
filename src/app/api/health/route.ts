import { projectRepository } from '@/domain/project'

/**
 * Liveness endpoint for Dokploy's healthcheck.
 *
 * It reads the project registry rather than returning a bare `ok`, so a
 * container whose content failed to load reports unhealthy instead of serving
 * a silently empty gallery. A TCP check would call that container fine.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await projectRepository.getAll()

    return Response.json(
      { status: 'ok', projects: projects.length },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}

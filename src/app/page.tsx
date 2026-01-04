import { notFound } from 'next/navigation';

export default function Home() {
  // Privacy by default: Return 404 for self-hosted bot deployments
  // This is an API-only service - the only valid endpoint is /api/discord
  notFound();
}

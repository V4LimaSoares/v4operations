// Unreachable in normal use: proxy.ts redirects "/" to /dashboard or /login before this renders.
export default function RootPage() {
  return null;
}

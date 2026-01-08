import { env } from '../env';

export default function Home() {
  // Client-side access - runtime values!
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const appName = env.NEXT_PUBLIC_APP_NAME;

  return (
    <div>
      <h1>{appName}</h1>
      <p>API URL: {apiUrl}</p>
    </div>
  );
}

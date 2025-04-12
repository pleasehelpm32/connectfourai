// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/game");

  // This won't be rendered
  return null;
}

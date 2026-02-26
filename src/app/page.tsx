import { redirect } from "next/navigation";\n\nexport default function HomePage() {\n  redirect("/login");\n}

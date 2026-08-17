import { redirect } from "next/navigation";

// The main dashboard IS the live queue engine — avoid duplicating it here.
export default function DoctorQueuePage() {
  redirect("/doctor/dashboard");
}

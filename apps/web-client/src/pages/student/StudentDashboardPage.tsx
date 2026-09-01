import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Student dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">My learning</h1>
        </div>
        <Button variant="secondary">Enroll now</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Current enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">6</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average</CardTitle>
            <CardDescription>Across this term</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">92%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Next lesson tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">9:30 AM</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

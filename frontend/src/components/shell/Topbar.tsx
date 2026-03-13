import { Badge } from "@/components/ui/badge";

export default function Topbar() {
  return (
    <div className="h-14 border-b flex items-center justify-between px-6">
      <div className="font-semibold">LRMS</div>

      <Badge variant="secondary">STUDENT</Badge>
    </div>
  );
}

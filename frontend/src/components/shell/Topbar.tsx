import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Topbar() {
  return (
    <div className="h-14 border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="font-semibold">LRMS</div>
        <div className="w-[420px] max-w-[50vw]">
          <Input placeholder="Search resources..." />
        </div>
      </div>

      <Badge variant="secondary">STUDENT</Badge>
    </div>
  );
}

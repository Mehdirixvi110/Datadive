import { SingletonScreen } from "@/components/admin/screens";

export const dynamic = "force-dynamic";

export default function Page() {
  return <SingletonScreen entity="settings" />;
}

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { signOutAction } from "@/app/admin/actions/session";

/**
 * Sign-out control (design §9/§12). A form posting to the `signOutAction`
 * server action — no client JS required. Rendered in the admin shell header.
 */
export function SignOut() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut aria-hidden="true" className="h-4 w-4" />
        Sign out
      </Button>
    </form>
  );
}

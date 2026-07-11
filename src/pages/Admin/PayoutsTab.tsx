import PayoutStudentListCard from "./PayoutStudentListCard";
import { useTriggerDeduction } from "../../hooks/usePayouts";
import Button from "../../components/ui/button/Button";

export default function PayoutsTab() {
  const triggerMutation = useTriggerDeduction();

  return (
    <div className="space-y-6">
      {/* Trigger deduction (for testing / catch-up) */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (
              confirm(
                "This will create pending deduction transactions for last month's classes. Continue?"
              )
            ) {
              triggerMutation.mutate();
            }
          }}
          disabled={triggerMutation.isPending}
        >
          {triggerMutation.isPending
            ? "Triggering..."
            : "Trigger Monthly Deduction"}
        </Button>
      </div>

      {/* Student Balances */}
      <PayoutStudentListCard />
    </div>
  );
}

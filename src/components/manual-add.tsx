"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import { createTransaction } from "@/app/[lang]/(app)/actions";
import type { Category } from "@/lib/data";
import type { CurrencyCode } from "@/lib/money";
import { useT } from "@/i18n/provider";

export function ManualAdd({
  categories,
  currency,
}: {
  categories: Category[];
  currency: CurrencyCode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        variant="outline"
        className="h-11 w-full"
        onClick={() => setOpen(true)}
      >
        <Plus />
        {t.transactionForm.addButton}
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              {t.transactionForm.newTitle}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pt-4">
            {open && (
              <TransactionForm
                categories={categories}
                currency={currency}
                onSubmit={(input) =>
                  createTransaction({ ...input, source: "manual" })
                }
                onSaved={() => {
                  setOpen(false);
                  toast.success(t.transactionForm.added);
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

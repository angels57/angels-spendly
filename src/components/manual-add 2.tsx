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
import { createTransaction } from "@/app/(app)/actions";
import type { Category } from "@/lib/data";

export function ManualAdd({
  categories,
  currency,
}: {
  categories: Category[];
  currency: string;
}) {
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
        Añadir movimiento
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">
              Nuevo movimiento
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {open && (
              <TransactionForm
                categories={categories}
                currency={currency}
                onSubmit={async (input) => {
                  const result = await createTransaction({
                    ...input,
                    source: "manual",
                  });
                  if (result.ok) {
                    setOpen(false);
                    toast.success("Movimiento añadido");
                  }
                  return result;
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

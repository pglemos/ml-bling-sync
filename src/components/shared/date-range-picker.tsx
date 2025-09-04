"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shared/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DatePickerWithRangeProps {
  date?: DateRange;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [fromDate, setFromDate] = React.useState(
    date?.from ? format(date.from, "yyyy-MM-dd") : ""
  );
  const [toDate, setToDate] = React.useState(
    date?.to ? format(date.to, "yyyy-MM-dd") : ""
  );

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value) {
      const newFromDate = new Date(value);
      setDate({
        from: newFromDate,
        to: date?.to || newFromDate,
      });
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (value) {
      const newToDate = new Date(value);
      setDate({
        from: date?.from || newToDate,
        to: newToDate,
      });
    }
  };

  const formatDateRange = () => {
    if (date?.from) {
      if (date.to) {
        return `${format(date.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(
          date.to,
          "dd/MM/yyyy",
          { locale: ptBR }
        )}`;
      } else {
        return format(date.from, "dd/MM/yyyy", { locale: ptBR });
      }
    }
    return "Selecione o período";
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data inicial</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data final</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
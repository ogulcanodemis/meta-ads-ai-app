"use client";

import * as React from "react";
import { addDays, format, subMonths, addMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithRangeProps {
  value: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  const [month, setMonth] = React.useState<Date>(value?.from || new Date());

  const minDate = React.useMemo(() => subMonths(new Date(), 24), []);
  const maxDate = React.useMemo(() => addMonths(new Date(), 24), []);

  // Handler for month/year changes
  const handleMonthYearChange = (newMonth: number, newYear?: number) => {
    const newDate = new Date(month);
    if (newYear) newDate.setFullYear(newYear);
    newDate.setMonth(newMonth);
    setMonth(newDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-black border border-gray-800 shadow-lg z-50" 
          align="start"
        >
          <div className="p-3 border-b border-gray-800">
            <div className="flex justify-center space-x-2">
              <Select
                value={month.getMonth().toString()}
                onValueChange={(value) => handleMonthYearChange(parseInt(value))}
              >
                <SelectTrigger className="w-[120px] bg-black border-gray-800">
                  <SelectValue>{format(month, 'MMMM')}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-800">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem 
                      key={i} 
                      value={i.toString()}
                      className="hover:bg-gray-800"
                    >
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={month.getFullYear().toString()}
                onValueChange={(value) => handleMonthYearChange(month.getMonth(), parseInt(value))}
              >
                <SelectTrigger className="w-[100px] bg-black border-gray-800">
                  <SelectValue>{format(month, 'yyyy')}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-black border-gray-800">
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i
                  ).map((year) => (
                    <SelectItem 
                      key={year} 
                      value={year.toString()}
                      className="hover:bg-gray-800"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            month={month}
            defaultMonth={month}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            className="bg-black rounded-md"
            fromDate={minDate}
            toDate={maxDate}
            onMonthChange={setMonth}
            showOutsideDays={false}
            pagedNavigation
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 
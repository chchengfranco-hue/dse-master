"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

import { cn } from "@/lib/utils"

// Detect mobile (touch) device
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  return isMobile;
}

const SelectContext = React.createContext({});

function Select({ children, value, onValueChange, defaultValue, disabled, ...props }) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, isMobile, disabled }}>
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        open={isMobile ? false : open}
        onOpenChange={(o) => { if (!isMobile) setOpen(o); }}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  );
}

const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { setOpen, isMobile, disabled } = React.useContext(SelectContext);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={isMobile && !disabled ? (e) => { e.preventDefault(); setOpen(true); } : undefined}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const { open, setOpen, onValueChange, isMobile } = React.useContext(SelectContext);

  if (isMobile) {
    // Collect items from children for drawer rendering
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerTitle className="sr-only">Select an option</DrawerTitle>
          <div className="overflow-y-auto py-2 px-2">
            <MobileItems onValueChange={onValueChange} setOpen={setOpen}>
              {children}
            </MobileItems>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName

// Recursively clone SelectItem children and wire them up for mobile drawer
function MobileItems({ children, onValueChange, setOpen }) {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === SelectItem || (child.type && child.type.displayName === 'SelectItem')) {
      return (
        <button
          key={child.props.value}
          className="w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-accent active:bg-accent flex items-center gap-2"
          onClick={() => { onValueChange?.(child.props.value); setOpen(false); }}
        >
          {child.props.children}
        </button>
      );
    }
    if (child.props?.children) {
      return React.cloneElement(child, {}, <MobileItems onValueChange={onValueChange} setOpen={setOpen}>{child.props.children}</MobileItems>);
    }
    return child;
  });
}

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
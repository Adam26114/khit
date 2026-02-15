import type { ElementType } from "react";
import type { IconProps, IconWeight } from "@solar-icons/react";
import {
  AddSquare,
  AltArrowRight,
  ArrowRight as SolarArrowRight,
  Bag,
  Box,
  CheckCircle as SolarCheckCircle,
  ClockCircle,
  CloseCircle,
  Delivery,
  Filter,
  HamburgerMenu,
  Heart as SolarHeart,
  Lock as SolarLock,
  Logout,
  Magnifier,
  MinusSquare,
  MoneyBag,
  Shop,
  TrashBinMinimalistic,
  User as SolarUser,
} from "@solar-icons/react";

type SolarIconProps = Omit<IconProps, "weight"> & {
  weight?: string;
};

function normalizeWeight(weight?: string): IconWeight | undefined {
  if (!weight) return "BoldDuotone";
  const value = weight.toLowerCase();
  if (value === "duotone") return "BoldDuotone";
  if (value === "boldduotone") return "BoldDuotone";
  if (value === "fill") return "Bold";
  if (value === "bold") return "Bold";
  if (value === "light") return "BoldDuotone";
  if (value === "linear" || value === "outline" || value === "broken" || value === "lineduotone") return "BoldDuotone";
  return "BoldDuotone";
}

function adaptIcon(Comp: ElementType) {
  return function AdaptedIcon({ weight, ...props }: SolarIconProps) {
    return <Comp {...props} weight={normalizeWeight(weight)} />;
  };
}

export const ArrowRight = adaptIcon(SolarArrowRight);
export const CaretRight = adaptIcon(AltArrowRight);
export const Package = adaptIcon(Box);
export const User = adaptIcon(SolarUser);
export const SignOut = adaptIcon(Logout);
export const ShoppingBag = adaptIcon(Bag);
export const Heart = adaptIcon(SolarHeart);
export const Storefront = adaptIcon(Shop);
export const Truck = adaptIcon(Delivery);
export const Money = adaptIcon(MoneyBag);
export const Lock = adaptIcon(SolarLock);
export const CheckCircle = adaptIcon(SolarCheckCircle);
export const Clock = adaptIcon(ClockCircle);
export const Minus = adaptIcon(MinusSquare);
export const Plus = adaptIcon(AddSquare);
export const Trash = adaptIcon(TrashBinMinimalistic);
export const MagnifyingGlass = adaptIcon(Magnifier);
export const List = adaptIcon(HamburgerMenu);
export const X = adaptIcon(CloseCircle);
export const Faders = adaptIcon(Filter);

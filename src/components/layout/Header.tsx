"use client";

import { Icon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import {
  cartTotals,
  openDrawer,
  openMenu,
  openSearch,
  showWishlist,
} from "@/state/actions";
import { useStore } from "@/state/store";

export function Header() {
  const wishCount = useStore((s) => s.wish.length);
  const bagCount = useStore((s) => cartTotals(s.cart).count);
  const menuOpen = useStore((s) => s.menuOpen);

  return (
    <header className="header" id="header">
      <nav className="nav-inner" aria-label="Main">
        <Logo />
        <button
          className="icon-btn"
          type="button"
          id="search-btn"
          aria-label="Search"
          onClick={openSearch}
        >
          <Icon name="search" />
        </button>
        <button
          className="icon-btn"
          type="button"
          id="wish-btn"
          aria-label="Wishlist"
          onClick={showWishlist}
        >
          <Icon name="heart" />
          <span className="badge-n" id="wish-count" data-n={wishCount}>
            {wishCount || ""}
          </span>
        </button>
        <button
          className="icon-btn"
          type="button"
          id="bag-btn"
          aria-label="Bag"
          onClick={openDrawer}
        >
          <Icon name="bag" />
          <span className="badge-n" id="bag-count" data-n={bagCount}>
            {bagCount || ""}
          </span>
        </button>
        <button
          className="menu-btn"
          type="button"
          id="menu-btn"
          aria-expanded={menuOpen}
          aria-controls="menu"
          onClick={openMenu}
        >
          <span className="lbl">MENU</span>
          <span className="bars" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
        </button>
      </nav>
    </header>
  );
}

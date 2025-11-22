// MobileMenu.tsx
type MobileMenuProps = {
  children: React.ReactNode;
};

const MobileMenu = ({ children }: MobileMenuProps) => {
  return <ul className="mobile-menu">{children}</ul>;
};

export default MobileMenu;

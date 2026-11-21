import React from 'react';
import { Icon } from '@/components/icon/Icon';
import type { IconName } from '@/components/icon/icons';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const MOBILE_MENU_ITEM_CLASS = 'min-h-10 items-center justify-between';

export const MobileSessionsPageItem: React.FC<{
  icon: IconName;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <DropdownMenuItem onClick={onClick} className={MOBILE_MENU_ITEM_CLASS}>
    <span className="flex items-center gap-2">
      <Icon name={icon} className="size-4" />
      {label}
    </span>
  </DropdownMenuItem>
);

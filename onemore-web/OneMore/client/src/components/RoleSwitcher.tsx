import { useState } from 'react';

interface RoleSwitcherProps {
  currentRole: 'attendee' | 'organizer';
  onRoleChange: (role: 'attendee' | 'organizer') => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center space-x-2 bg-muted rounded-full p-1">
      <button
        data-testid="button-switch-attendee"
        onClick={() => onRoleChange('attendee')}
        className={`px-3 py-1 rounded-full text-xs font-medium touch-target transition-colors ${
          currentRole === 'attendee'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Attendee
      </button>
      <button
        data-testid="button-switch-organizer"
        onClick={() => onRoleChange('organizer')}
        className={`px-3 py-1 rounded-full text-xs font-medium touch-target transition-colors ${
          currentRole === 'organizer'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Organizer
      </button>
    </div>
  );
}

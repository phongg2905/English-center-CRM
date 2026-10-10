import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ShiftSlotAvailability, PlacementTestWithDetails } from '../../types/placement-test';

interface ShiftCapacityAlertProps {
  slots: ShiftSlotAvailability[];
  tests?: PlacementTestWithDetails[];
}

export const ShiftCapacityAlert: React.FC<ShiftCapacityAlertProps> = ({ slots }) => {
  const fullSlots = slots.filter((s) => s.isFull || s.totalBooked >= s.maxCapacity);

  if (fullSlots.length === 0) return null;

  return (
    <div className="pt-alert-banner danger">
      <div className="pt-alert-content">
        <AlertTriangle size={20} color="#dc2626" />
        <div>
          <strong>CẢNH BÁO SỨC CHỨA: Có {fullSlots.length} ca thi đã đạt tối đa sức chứa (10/10 thí sinh)!</strong>
          <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px' }}>
            {fullSlots.map((s, idx) => (
              <span key={idx} style={{ marginRight: '10px' }}>
                • {s.testDate} [{s.timeSlot}] - {s.room} (ĐÃ ĐẦY)
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

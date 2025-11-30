import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface PrintMeasurementProps {
  measurement: any;
}

const PrintMeasurement: React.FC<PrintMeasurementProps> = ({ measurement }) => {
  const { settings } = useSettings();
  const systemName = settings.name || 'FitTrack';
  const customerName = measurement?.customer_name || 'Customer';

  return (
    <>
      <div className="hidden print:block">
        <div className="p-8">
          <div className="mb-8 text-center">
            <img src={settings.logo || "/applogo.png"} alt={systemName} className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primary-navy">{systemName}</h1>
            <p className="text-steel">{settings.tagline || 'Measurement Record'}</p>
            <p className="text-sm text-steel mt-2">Customer: {customerName}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-steel">Name:</p>
                <p className="font-medium">{measurement.customer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Phone:</p>
                <p className="font-medium">{measurement.customer_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Email:</p>
                <p className="font-medium">{measurement.customer_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Entry ID:</p>
                <p className="font-medium">{measurement.entry_id || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Top Measurements ({measurement.units})</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-steel">Across Back:</p>
                <p className="font-medium">{measurement.across_back || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Chest:</p>
                <p className="font-medium">{measurement.chest || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Sleeve Length:</p>
                <p className="font-medium">{measurement.sleeve_length || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Around Arm:</p>
                <p className="font-medium">{measurement.around_arm || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Neck:</p>
                <p className="font-medium">{measurement.neck || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Top Length:</p>
                <p className="font-medium">{measurement.top_length || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Wrist:</p>
                <p className="font-medium">{measurement.wrist || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Trouser Measurements ({measurement.units})</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-steel">Waist:</p>
                <p className="font-medium">{measurement.trouser_waist || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Thigh:</p>
                <p className="font-medium">{measurement.trouser_thigh || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Knee:</p>
                <p className="font-medium">{measurement.trouser_knee || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Trouser Length:</p>
                <p className="font-medium">{measurement.trouser_length || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-steel">Bars:</p>
                <p className="font-medium">{measurement.trouser_bars || 'N/A'}</p>
              </div>
            </div>
          </div>

          {measurement.additional_info && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary-navy mb-4 border-b pb-2">Additional Information</h2>
              <p className="text-steel">{measurement.additional_info}</p>
            </div>
          )}

          <div className="mt-8 text-sm text-steel text-center border-t pt-4">
            <p className="font-semibold text-primary-navy mb-2">{systemName} - Measurement Record</p>
            <p>Created: {new Date(measurement.created_at).toLocaleDateString()}</p>
            {measurement.created_by_name && <p>Created by: {measurement.created_by_name}</p>}
            {measurement.entry_id && <p>Entry ID: {measurement.entry_id}</p>}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default PrintMeasurement;


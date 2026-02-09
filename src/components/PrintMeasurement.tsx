import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface PrintMeasurementProps {
  measurement: any;
}

const PrintMeasurement: React.FC<PrintMeasurementProps> = ({ measurement }) => {
  const { settings } = useSettings();

  if (!measurement) {
    return null;
  }

  const systemName = settings.name || 'FitTrack';
  const units = measurement.units || 'cm';

  const topRows = [
    { label: 'Across Back', value: measurement.across_back },
    { label: 'Chest', value: measurement.chest },
    { label: 'Sleeve', value: measurement.sleeve_length },
    { label: 'Around Arm', value: measurement.around_arm },
    { label: 'Neck', value: measurement.neck },
    { label: 'Top Length', value: measurement.top_length },
    { label: 'Wrist', value: measurement.wrist },
  ];
  const trouserRows = [
    { label: 'Waist', value: measurement.trouser_waist },
    { label: 'Thigh', value: measurement.trouser_thigh },
    { label: 'Knee', value: measurement.trouser_knee },
    { label: 'Length', value: measurement.trouser_length },
    { label: 'Bars', value: measurement.trouser_bars },
  ];

  return (
    <>
      <div className="print-measurement-card">
        <div className="print-card-header">
          <img src={settings.logo || '/applogo.png'} alt="" className="print-card-logo" />
          <div>
            <h1 className="print-card-title">{systemName}</h1>
            <p className="print-card-entry">#{measurement.entry_id || '—'}</p>
          </div>
        </div>
        <div className="print-card-customer">
          <strong>{measurement.customer_name || 'Customer'}</strong>
          {measurement.customer_phone && <span> · {measurement.customer_phone}</span>}
        </div>
        <div className="print-card-grid">
          <div className="print-card-section">
            <div className="print-card-section-title">Top ({units})</div>
            {topRows.map(({ label, value }) => (
              <div key={label} className="print-card-row">
                <span className="print-card-label">{label}</span>
                <span className="print-card-value">{value ?? '—'}</span>
              </div>
            ))}
          </div>
          <div className="print-card-section">
            <div className="print-card-section-title">Trouser ({units})</div>
            {trouserRows.map(({ label, value }) => (
              <div key={label} className="print-card-row">
                <span className="print-card-label">{label}</span>
                <span className="print-card-value">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
        {measurement.additional_info && (
          <div className="print-card-notes">
            <span className="print-card-label">Notes: </span>
            <span>{measurement.additional_info}</span>
          </div>
        )}
        <div className="print-card-footer">
          {new Date(measurement.created_at).toLocaleDateString()}
          {measurement.created_by_name && ` · ${measurement.created_by_name}`}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: auto; margin: 12mm; }
          body * { visibility: hidden; }
          [data-print-root], [data-print-root] * { visibility: visible; }
          [data-print-root] {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
          }
          .print-measurement-card {
            width: 85mm;
            max-width: 85mm;
            min-height: 54mm;
            padding: 4mm;
            border: 1px solid #333;
            border-radius: 2mm;
            background: #fff;
            box-shadow: none;
            font-size: 7px;
            line-height: 1.25;
            color: #111;
          }
          .print-card-header {
            display: flex;
            align-items: center;
            gap: 3mm;
            border-bottom: 1px solid #333;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .print-card-logo {
            width: 12mm;
            height: 12mm;
            object-fit: contain;
          }
          .print-card-title { font-size: 10px; font-weight: 700; margin: 0; color: #0D2136; }
          .print-card-entry { font-size: 7px; margin: 0; color: #586577; }
          .print-card-customer { font-size: 9px; margin-bottom: 2mm; }
          .print-card-grid { display: flex; gap: 4mm; }
          .print-card-section { flex: 1; }
          .print-card-section-title { font-size: 7px; font-weight: 700; text-transform: uppercase; margin-bottom: 1mm; color: #586577; }
          .print-card-row { display: flex; justify-content: space-between; gap: 2mm; }
          .print-card-label { color: #586577; }
          .print-card-value { font-weight: 600; }
          .print-card-notes { font-size: 7px; margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #ddd; }
          .print-card-footer { font-size: 6px; color: #586577; margin-top: 2mm; }
        }
      `}</style>
    </>
  );
};

export default PrintMeasurement;

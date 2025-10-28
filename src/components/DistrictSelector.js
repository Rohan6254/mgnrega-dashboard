import React from 'react';

export default function DistrictSelector({ districts, onSelect }) {
    return (
        <select onChange={(e) => onSelect(e.target.value)}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
    );
}

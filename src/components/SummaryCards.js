export default function SummaryCards({ data }) {
    return (
        <div style={{display:'flex', gap:'10px'}}>
            <div>👷 Jobs: {data.total_jobs}</div>
            <div>💰 Funds: {data.funds_spent}</div>
            <div>🕓 Days: {data.days_worked}</div>
            <div>⚠️ Pending: {data.pending_wages}</div>
        </div>
    );
}

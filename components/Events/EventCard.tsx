

export default function EventCard({ event }: { event: any }) {
  const { id, name, description, date, location } = event;

  return (
    <div className="event-card">
      <h2>{name}</h2>
      <p>{description}</p>
      <p>{date}</p>
      <p>{location}</p>
      <button onClick={() => console.log(`Event ID: ${id}`)}>View Details</button>
    </div>
  );
}
type Contact = {
  id: string;
  name: string;
  email: string;
};

import ContactCard from "./ContactCard";

export default function ContactsList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="text-slate-300">No contacts found.</p>;
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}

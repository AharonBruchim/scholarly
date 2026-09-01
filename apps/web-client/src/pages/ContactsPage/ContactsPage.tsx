import ContactsList from "../../components/Contacts/ContactsList";
import NewContactButton from "../../components/Contacts/NewContactButton/NewContactButton";

const sampleContacts = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Marco Silva", email: "marco@example.com" },
];

export default function ContactsPage() {
  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-white">Contacts</h1>
        <ContactsList contacts={sampleContacts} />
      </div>
      <NewContactButton />
    </div>
  );
}

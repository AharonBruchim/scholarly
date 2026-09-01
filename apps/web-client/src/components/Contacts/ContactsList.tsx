import { useTranslation } from "react-i18next";
import ContactCard from "./ContactCard";

type Contact = {
  id: string;
  name: string;
  email: string;
};

export default function ContactsList({ contacts }: { contacts: Contact[] }) {
  const { t } = useTranslation();

  if (contacts.length === 0) {
    return <p className="text-slate-300">{t("contacts.empty")}</p>;
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}

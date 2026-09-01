import { useState } from "react";

export const useEditContactDialog = (
  initialName: string,
  initialEmail: string
) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);

  const reset = () => {
    setName(initialName);
    setEmail(initialEmail);
  };

  return {
    open,
    name,
    email,
    setName,
    setEmail,
    openDialog,
    closeDialog,
    reset,
  };
};

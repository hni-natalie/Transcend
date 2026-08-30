export interface DropdownChoice {
  id: string;
  name: string;
}

export interface OptionProps {
  choices: DropdownChoice[];
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
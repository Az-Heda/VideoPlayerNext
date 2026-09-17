import { KeybindLS } from "@/lib/globals";
import { Fragment, JSX, useEffect, useMemo, useState } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Input } from "./ui/input";

export function KeyKeyboard(props: KeybindLS) {

  const parts = useMemo(() => {
    return ([
      [!!props.Ctrl, <Kbd key={`kbd-ctrl-${props.Key}`}>Ctrl</Kbd>],
      [!!props.Shift, <Kbd key={`kbd-shift-${props.Key}`}>Shift</Kbd>],
      [!!props.Alt, <Kbd key={`kbd-alt-${props.Key}`}>Alt</Kbd>],
      [!!props.Meta, <Kbd key={`kbd-meta-${props.Key}`}>Meta</Kbd>],
      [true, <Kbd key={`kbd-${props.Key}`}>{props.Key?.toUpperCase()}</Kbd>],
    ] as (readonly [boolean, JSX.Element])[])
      .filter(i => i[0])
      .map(i => i[1]);
  }, [props.Key, props.Alt, props.Ctrl, props.Meta, props.Shift])

  if (props.Key === undefined) {
    return <div></div>
  }
  return (
    <div className="flex justify-center items-center gap-1 text-sm *:text-sm font-mono *:font-mono">
      {
        parts.map((c, idx) => (
          <Fragment key={`command-keyboard-${idx}`}>
            {!!idx && <>+</>}
            {c}
          </Fragment>
        ))
      }
    </div>
  )
}


type EditKeyInputProps = {
  id: KeybindLS['Id'];
  changed: (k: KeybindLS) => void;
}
export function EditKeyInput(props: EditKeyInputProps) {
  const [currentValue, setCurrentValue] = useState<string>('');
  const inputName = useMemo(() => `edit-keybind-${props.id}`, [props])

  useEffect(() => {
    if (!inputName) return;
    const input = document.querySelector<HTMLInputElement>(`input[name="${inputName}"]`);
    if (!input) return;
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      e.preventDefault();
      const parts = ([
        [e.ctrlKey, 'CTRL'],
        [e.shiftKey, 'SHIFT'],
        [e.altKey, 'ALT'],
        [e.metaKey, 'META'],
      ] as readonly [boolean, string][])
        .filter(i => i[0])
        .filter(i => !['Control', 'Shift', 'Alt', 'Meta'].includes(i[1]))
        .map(i => i[1].toUpperCase());

      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        const value = {
          Id: props.id,
          Key: e.key.toUpperCase(),
          Ctrl: e.ctrlKey,
          Alt: e.altKey,
          Meta: e.metaKey,
          Shift: e.shiftKey,
        }
        setCurrentValue([...parts, value.Key].join('+'));
        props.changed(value);
      } else setCurrentValue(parts.join('+'));
      })
  }, [inputName]);

  return <Input
    name={inputName}
    value={currentValue}
    onChange={(e => setCurrentValue(e.target.value))}
  />
}
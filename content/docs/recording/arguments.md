---
title: Keyword arguments
description: Turn a recorded value, part of it or part of a selector into an argument while you record — with or without a default, and everywhere it occurs.
section: recording
order: 3
---

A keyword that always creates the account `jane@example.com` is useful once.
Make the name and the password **arguments** while you record, and the same
keyword creates any account. Values in the toolbar that can become an argument
are underlined; click one.

::doc-video{src="/videos/recorder/loop-create-account.mp4" poster="/videos/recorder/loop-create-account.jpg" alt="A Create account form with the fields Email, Confirm email, Password and Confirm password, and the recorder toolbar beside it with five recorded Keyword Calls. A click on the value jane@example.com opens the argument dialog; jane is marked, the name name is typed and the default checkbox is cleared. The toolbar offers to use the argument in the Confirm email call too, and Replace accepts. The same follows for the password Secret-123 as the argument password. The toolbar lists the arguments name and password." :controls="false"}
`jane` becomes `${name}`, `Secret-123` becomes `${password}`, each in both fields.
::

```robot
*** Keywords ***
Create Account
    [Tags]    recorded
    [Arguments]    ${name}    ${password}
    Fill Text    role=textbox[name="Email"s]    ${name}@example.com
    Fill Text    role=textbox[name*="Confirm email"i]    ${name}@example.com
    Fill Text    role=textbox[name="Password"s]    ${password}
    Fill Text    role=textbox[name*="Confirm password"i]    ${password}
    Click    role=button[name*="Create account"i]
```

```robot-repl
Create Account    jane    Secret-123
Create Account    max    ${NEW_PASSWORD}
```

## The argument dialog

::doc-figure{src="/images/recorder/toolbar-argument-dialog.png" alt="The argument dialog: the value jane@example.com with jane marked, the argument name name, the cleared box Use the marked value as default, and the buttons Cancel and Make argument."}
Only the marked part, `jane`, becomes the argument `${name}`, without a default.
::

Clicking a value opens a dialog with three things to decide:

1. **Which part.** The value is shown in full. Leave it unmarked to turn the
   whole value into the argument, as with the password, or mark a part of it —
   only that part becomes the argument, as `jane` in the address. The marked
   part stays highlighted when you move on to the name.
2. **The name**, as `name` or as `${name}`.
3. **Whether the recorded value becomes the default.** Checked, callers may leave
   the argument out; unchecked, they must pass it. A new account needs a new
   name and nobody wants a password built into a keyword, so both are unchecked
   here.

*Make argument* applies it. A name the recorder cannot accept is shown in the
dialog, which stays open so you can correct it; *Cancel*, Escape or a click
beside the dialog close it without changes.

Arguments without a default always come first, as Robot Framework requires. Give
a default only to arguments recorded after all those without one, and
`[Arguments]` keeps the order of the recording.

## Part of a value

Marking a part is how addresses, URLs, IDs and composed texts become arguments.
The rest of the value stays as it was — here `@example.com` — escaped where
Robot Framework needs it:

```robot
Fill Text    role=textbox[name="Email"s]    ${name}@example.com
```

A value that already contains an argument cannot get a second one.

## Selectors

Selectors can become arguments too — whole, or in part. That turns one recorded
click into a keyword for a whole family of elements:

::doc-video{src="/videos/recorder/argument-from-a-selector.mp4" poster="/videos/recorder/argument-from-a-selector.jpg" alt="The Getting started page. A click on Assertions in the side navigation is recorded. In the toolbar the selector of that click is opened in the argument dialog, the word Assertions inside it is marked, and the argument is named chapter."}
The chapter name inside the selector becomes `${chapter}`.
::

```robot
*** Keywords ***
Open A Docs Chapter
    [Tags]    recorded
    [Arguments]    ${chapter}=Assertions
    Click    role=link[name="${chapter}"s]
```

```robot-repl
Open A Docs Chapter    Selectors
Open A Docs Chapter    chapter=Waiting and promises
```

Mark only the part that varies. The structure around it — `role=link`,
`[name=…]`, the `s` that makes the match exact — is what keeps the selector
precise.

## The same value elsewhere

When the value you made an argument occurs in other Keyword Calls of the same
keyword, the toolbar offers to use the argument there too. Each occurrence is
listed with a checkbox, all checked: *Replace* uses the argument for the checked
ones, *Skip* leaves them as they are.

::doc-figure{src="/images/recorder/toolbar-offer.png" alt="The toolbar offers to use the new argument name for jane in the Fill Text call of the Confirm email field, where jane is marked red like in the argument dialog, with a checked box and the buttons Skip and Replace."}
`jane` also occurs in the confirmed address; the occurrence is offered, already checked, with the part it replaces marked.
::

That is how both email fields and both password fields of `Create Account` get
the same argument: one argument per value, replaced in every field that repeats it.

## While you keep typing

Make an argument from a field you are still typing into, and the argument
stays: the Keyword Call keeps `${name}`, and its default follows what you type.
*Undo* removes an action together with any argument that only it used — a
recorded keyword never declares an argument it does not use.

## Names

An argument name is plain — `name` — or written as a variable — `${name}`.
It must:

- start with a letter or `_` and contain only letters, digits and `_`;
- not be a Robot Framework built-in variable such as `${TEMPDIR}` or `${SPACE}`;
- not be taken already in the keyword, in any spelling Robot Framework treats as
  equal — `Name`, `na_me` and `name` are one name. Variables the recorder
  assigns itself, like `${download}` and `${upload}`, count too;
- be at most 200 characters long.

The dialog checks while you type and again when you confirm.

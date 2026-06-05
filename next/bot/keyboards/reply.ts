import { Keyboard } from "grammy";
import { t } from "../messages/fa";

export function authReplyKeyboard() {
  return new Keyboard().text(t.authButton).resized();
}

export function mainMenuReplyKeyboard() {
  return new Keyboard()
    .text(t.menuNewRequest)
    .text(t.menuHistory)
    .row()
    .text(t.cancel)
    .resized();
}

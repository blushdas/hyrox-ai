import { expect, test } from "vitest"
import { validateRequest } from "./request"
const input = { messages: [{role:"user",content:"Today's session?"}], context:{category:"open",raceDate:"2026-12-20",daysPerWeek:4,currentWeek:1,sessions:[]} }
test("absent webSearch defaults false",()=>expect(validateRequest(input).webSearch).toBe(false))
test.each([true,false])("boolean webSearch %s preserved",webSearch=>expect(validateRequest({...input,webSearch}).webSearch).toBe(webSearch))

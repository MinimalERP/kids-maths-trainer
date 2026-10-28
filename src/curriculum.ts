export type LearningTask = {
  day: number
  title: string
  topic: string
  prompt: string
  choices: string[]
  answer: string
  hint: string
  icon: string
  color: string
  remoteId?: string
}

type Random = () => number

function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function numberChoices(answer: number, random: Random, prefix = ''): string[] {
  const distractors = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 3]
    .filter((value, index, list) => value >= 0 && value !== answer && list.indexOf(value) === index)
  const selected = shuffle(distractors, random).slice(0, 2)
  return shuffle([answer, ...selected], random).map(value => `${prefix}${value}`)
}

function task(base: LearningTask, random: Random, index: number, prompt: string, answer: string, hint: string, choices?: string[]): LearningTask {
  const numericAnswer = Number(answer.replace(/[^0-9.-]/g, ''))
  const options = choices || (Number.isFinite(numericAnswer)
    ? numberChoices(numericAnswer, random, answer.startsWith('₹') ? '₹' : '')
    : [])
  return { ...base, title: `${base.title} · ${index + 1}`, prompt, answer, choices: options, hint, remoteId: undefined }
}

const pick = <T,>(values: T[], random: Random) => values[Math.floor(random() * values.length)]

export function buildDailyTasks(base: LearningTask): LearningTask[] {
  if (base.day > 30) return [base]
  let seed = base.day * 9871 + 71
  const random: Random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647 }
  const extra: LearningTask[] = []
  const add = (prompt: string, answer: string | number, hint: string, choices?: string[]) => {
    extra.push(task(base, random, extra.length + 2, prompt, String(answer), hint, choices))
  }
  const num = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))

  for (let i = 0; i < 24; i++) {
    switch (base.day) {
      case 1: {
        const count = num(2, 20)
        add(`Count the stars: ${'⭐ '.repeat(count).trim()}`, count, 'Touch each star once as you count.')
        break
      }
      case 2: {
        const value = num(11, 29)
        const before = i % 2 === 0
        add(`What number comes ${before ? 'before' : 'after'} ${value}?`, value + (before ? -1 : 1), `Count one ${before ? 'back' : 'forward'} from ${value}.`)
        break
      }
      case 3: {
        const groups = num(2, 5), each = pick([2, 3, 5], random)
        add(`${groups} bags have ${each} marbles each. How many marbles altogether?`, groups * each, `Add ${each} ${groups} times, or count in groups of ${each}.`)
        break
      }
      case 4: {
        const a = num(10, 29), b = num(10, 30)
        if (a === b) { add(`Are ${a} and ${b} equal?`, 'Yes', 'The numbers match exactly.', ['Yes', 'No', 'Only sometimes']) }
        else { const bigger = Math.max(a, b); add(`Which number is bigger: ${a} or ${b}?`, String(bigger), 'Compare the tens first, then the ones.', [String(a), String(b), 'They are equal']) }
        break
      }
      case 5: {
        const step = pick([2, 5, 10], random), start = step * num(1, 4), next = start + step * 4
        add(`What comes next? ${start}, ${start + step}, ${start + 2 * step}, ${start + 3 * step}, __`, next, `The pattern goes up by ${step} each time.`)
        break
      }
      case 6: {
        const total = pick([10, 12, 15], random), first = num(1, total - 1)
        add(`${first} + __ = ${total}`, total - first, `How many more does ${first} need to reach ${total}?`)
        break
      }
      case 7: {
        const kind = i % 3
        if (kind === 0) { const a = num(2, 9), b = num(1, 9); add(`${a} + ${b} = ?`, a + b, 'Count on from the larger number.') }
        else if (kind === 1) { const a = num(11, 25); add(`What number comes before ${a}?`, a - 1, 'Take one step back.') }
        else { const a = num(12, 28), b = num(12, 29); add(`Which is bigger: ${a} or ${b}?`, Math.max(a, b), 'Look at the tens, then the ones.', [String(a), String(b), 'They are equal']) }
        break
      }
      case 8: {
        const a = num(1, 9), b = num(1, 10 - a)
        add(`${a} + ${b} = ?`, a + b, 'Count on, starting with the bigger number.')
        break
      }
      case 9: {
        const a = num(6, 14), b = num(2, Math.min(9, 20 - a))
        add(`${a} + ${b} = ?`, a + b, 'Make ten first, then add what is left.')
        break
      }
      case 10: {
        const a = pick([8, 9], random), b = num(3, 9)
        add(`${a} + ${b} = ?`, a + b, `Make ${a} into 10 first. How many do you move from ${b}?`)
        break
      }
      case 11: {
        const a = num(4, 10), b = num(1, a)
        add(`${a} − ${b} = ?`, a - b, 'Count backwards, one step at a time.')
        break
      }
      case 12: {
        const a = num(11, 20), b = num(2, Math.min(9, a))
        add(`${a} − ${b} = ?`, a - b, 'Take away enough to reach ten, then keep going.')
        break
      }
      case 13: {
        const a = num(2, 9), b = num(1, 9)
        if (i % 2 === 0) add(`${a} + __ = ${a + b}`, b, `Count up from ${a} to ${a + b}.`)
        else add(`${a + b} − __ = ${a}`, b, 'Think about the missing part between these two numbers.')
        break
      }
      case 14: {
        const a = num(2, 9), b = num(2, 9), total = a + b
        add(`A pencil costs ₹${a} and an eraser costs ₹${b}. What is the total?`, `₹${total}`, 'Add the rupees together.', [`₹${total}`, `₹${total + 2}`, `₹${Math.max(0, total - 2)}`])
        break
      }
      case 15: {
        const step = pick([2, 3, 5], random), start = num(1, 10)
        add(`What comes next? ${start}, ${start + step}, ${start + step * 2}, __`, start + step * 3, `Each step adds ${step}.`)
        break
      }
      case 16: {
        const shape = pick([
          ['Which shape has 3 sides?', 'Triangle', ['Triangle', 'Square', 'Circle'], 'A triangle has three straight sides.'],
          ['Which shape has no corners?', 'Circle', ['Circle', 'Rectangle', 'Triangle'], 'A circle is round and has no corners.'],
          ['Which shape has 4 equal sides?', 'Square', ['Square', 'Circle', 'Triangle'], 'A square has four equal sides.'],
          ['Which shape has 4 sides, with two long and two short?', 'Rectangle', ['Rectangle', 'Triangle', 'Circle'], 'A rectangle has two long sides and two short sides.']
        ] as [string, string, string[], string][], random)
        add(shape[0], shape[1], shape[3], shape[2])
        break
      }
      case 17: {
        const set = pick([
          ['Which one is not a fruit?', 'Pencil', ['Apple', 'Mango', 'Pencil'], 'Two are fruit; one is a school tool.'],
          ['Which one is not a shape?', 'Banana', ['Circle', 'Triangle', 'Banana'], 'Two are shapes; one is food.'],
          ['Which one cannot fly?', 'Fish', ['Bird', 'Butterfly', 'Fish'], 'Think about how each animal moves.'],
          ['Which one is not a toy?', 'Carrot', ['Ball', 'Doll', 'Carrot'], 'Two are toys; one is a vegetable.']
        ] as [string, string, string[], string][], random)
        add(set[0], set[1], set[3], set[2])
        break
      }
      case 18: {
        const count = num(5, 15)
        add(`You have ${count} blocks. If you spread them out, how many blocks do you still have?`, String(count), 'Moving the blocks does not change how many there are.')
        break
      }
      case 19: {
        const start = num(4, 12), change = num(2, 7)
        if (i % 2 === 0) add(`You have ${start} toy cars and get ${change} more. How many now?`, start + change, 'Put the two groups together.')
        else add(`There are ${start + change} birds. ${change} fly away. How many stay?`, start, 'Take away the birds that fly away.')
        break
      }
      case 20: {
        const close = pick([9, 10, 11], random), far = pick([3, 5, 16, 18], random)
        add(`Which amount is closest to 10 crayons: ${close}, ${far}, or 20?`, close, 'Compare how far each amount is from ten.', [String(close), String(far), '20'])
        break
      }
      case 21: {
        const riddle = pick([
          ['I am bigger than 5 and smaller than 7. What am I?', '6', ['5', '6', '8'], 'There is one whole number between 5 and 7.'],
          ['I am an even number between 10 and 14. What am I?', '12', ['11', '12', '13'], 'Even numbers can be shared into pairs.'],
          ['I have 3 sides and 3 corners. What shape am I?', 'Triangle', ['Circle', 'Triangle', 'Square'], 'Count the straight sides.'],
          ['I am 2 more than 8. What am I?', '10', ['9', '10', '12'], 'Count two steps forward from eight.']
        ] as [string, string, string[], string][], random)
        add(riddle[0], riddle[1], riddle[3], riddle[2])
        break
      }
      case 22: {
        const total = pick([12, 15], random), first = num(3, total - 3)
        add(`${first} + __ = ${total}`, total - first, `Find how many more ${first} needs to make ${total}.`)
        break
      }
      case 23: {
        const start = pick([18, 20, 22, 24], random)
        add(`Count back by 2s: ${start}, ${start - 2}, ${start - 4}, __`, start - 6, 'Take away two each time.')
        break
      }
      case 24: {
        const groups = num(2, 5), each = pick([2, 3, 5], random)
        add(`${groups} plates have ${each} biscuits each. How many biscuits?`, groups * each, `Add ${each} ${groups} times.`)
        break
      }
      case 25: {
        const item = pick([
          ['Which tool measures a pencil?', 'A ruler', ['A ruler', 'A spoon', 'A shoe'], 'A ruler shows centimetres.'],
          ['Which is longer: 12 cm or 8 cm?', '12 cm', ['8 cm', '12 cm', 'They are equal'], 'Compare the number of centimetres.'],
          ['A crayon is 6 cm and a pencil is 10 cm. Which is shorter?', 'The crayon', ['The crayon', 'The pencil', 'They are equal'], 'The smaller measurement is shorter.'],
          ['Which unit is useful for measuring a book?', 'Centimetres', ['Centimetres', 'Litres', 'Kilograms'], 'A ruler measures length in centimetres.']
        ] as [string, string, string[], string][], random)
        add(item[0], item[1], item[3], item[2])
        break
      }
      case 26: {
        const a = num(1, 10), b = num(1, 10), c = num(1, 5), total = a + b + c
        add(`₹${a} + ₹${b} + ₹${c} = ?`, `₹${total}`, 'Add two amounts first, then add the last one.', [`₹${total}`, `₹${total + 2}`, `₹${Math.max(0, total - 2)}`])
        break
      }
      case 27: {
        const missing = num(2, 9), start = num(2, 9)
        if (i % 2 === 0) add(`${start} + __ = ${start + missing}`, missing, 'Count up from the first number to the total.')
        else add(`${start + missing} − __ = ${start}`, missing, 'What amount was taken away?')
        break
      }
      case 28: {
        const a = num(3, 10), b = num(2, 7)
        if (i % 2 === 0) add(`You see ${a} ducks, then ${b} more arrive. How many ducks?`, a + b, 'Join both groups of ducks.')
        else add(`There are ${a + b} apples. You eat ${b}. How many are left?`, a, 'Start with all the apples and take some away.')
        break
      }
      case 29: {
        const kind = i % 4
        if (kind === 0) { const n = num(2, 10); add(`What comes after ${n}, ${n + 2}, ${n + 4}?`, n + 6, 'This pattern adds two each time.') }
        else if (kind === 1) { const a = num(2, 9), b = num(1, 9); add(`${a} + ${b} = ?`, a + b, 'Count on from the larger number.') }
        else if (kind === 2) add('Which shape has 3 sides?', 'Triangle', 'A triangle has three sides.', ['Circle', 'Triangle', 'Square'])
        else { const n = pick([8, 10, 12, 14, 16], random); add(`Can ${n} counters make pairs with none left over?`, 'Yes', 'Every even number can be paired.', ['Yes', 'No', 'Only sometimes']) }
        break
      }
      case 30: {
        const kind = i % 5
        if (kind === 0) { const a = num(2, 9), b = num(1, 9); add(`${a} + ${b} = ?`, a + b, 'Try making ten first.') }
        else if (kind === 1) { const a = num(11, 20), b = num(1, 8); add(`${a} − ${b} = ?`, a - b, 'Count backwards or take away ten first.') }
        else if (kind === 2) { const total = num(10, 15), first = num(2, total - 2); add(`${first} + __ = ${total}`, total - first, 'Find the missing part.') }
        else if (kind === 3) { const n = num(10, 25); add(`What number comes before ${n}?`, n - 1, 'Take one step back.') }
        else add('Which shape has 3 sides?', 'Triangle', 'A triangle has three sides.', ['Circle', 'Triangle', 'Square'])
        break
      }
    }
  }

  return [base, ...extra]
}

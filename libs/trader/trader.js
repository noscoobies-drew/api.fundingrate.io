//NOTE: temp.
const assert = require('assert')
const lodash = require('lodash')
const { Position, Stats } = require('./defaults')

module.exports = config => {
  const stats = Stats()

  const getAllowance = () => {
    return stats.balance * 0.1
  }

  // NOTE: assuption has been made that this was a queue... will have to be changed.
  const positions = []

  function change(a = 0, b = 0) {
    return 100 * Math.abs((a - b) / ((a + b) / 2))
  }

  return {
    get: id => positions.get(id),
    last: () => {
      return [...positions].pop()
    },
    list: () => {
      return [...positions]
    },
    setStat(k, v) {
      stats[k] = v
      return stats
    },
    getStat(k) {
      assert(stats[k], 'stat does not exist.')
      return stats[k]
    },
    getStats() {
      return { ...stats, count: positions.length }
    },
    openLong(id, price, qty = getAllowance()) {
      price = parseFloat(price)

      const pos = Position({
        id,
        type: 'LONG',
        qty,
        price,
      })

      positions.push(pos)
      stats.position = pos
      stats.longs += 1
      stats.price = price

      return pos
    },
    openShort(id, price, qty = getAllowance()) {
      price = parseFloat(price)

      const pos = Position({
        id,
        type: 'SHORT',
        qty,
        price,
      })

      positions.push(pos)
      stats.position = pos
      stats.shorts += 1
      stats.price = price

      return pos
    },
    close(id, price) {
      // merge trades and update closing values 

      price = parseFloat(price)

      const pos = positions.pop()

      // closed trade, do not add to active positions array.
      const trade = Position({
        ...pos,
        updated: Date.now(),
        closingPrice: price,
        done: true,
      })

      // profit per trade
      trade.profit =
        trade.type === 'SHORT'
          ? trade.price - trade.closingPrice
          : trade.closingPrice - trade.price

      // update balance to reflect profit/loss
      if (trade.profit) stats.balance += trade.profit

      trade.change = change(trade.price, trade.closingPrice)

      console.log(trade.id, 'Trade Closed.', trade)

      return trade
    },
  }
}

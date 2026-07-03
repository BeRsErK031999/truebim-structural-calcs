import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WallEndOpeningsPage, wallEndOpeningsRoute } from '../WallEndOpeningsPage'

describe('WallEndOpeningsPage', () => {
  it('defines the wall end openings route', () => {
    expect(wallEndOpeningsRoute).toBe('/wall-end-openings')
  })

  it('renders the calculator tab with inputs, results, and live contour preview', () => {
    const html = renderToStaticMarkup(<WallEndOpeningsPage />)

    expect(html).toContain('Расчет торца стены с отверстиями')
    expect(html).toContain('Задаваемые характеристики')
    expect(html).toContain('Вырезы на участке lx1')
    expect(html).toContain('Вырезы на участке lx2')
    expect(html).toContain('Вырезы на участке ly')
    expect(html).toContain('Контур продавливания торца стены')
    expect(html).toContain('Вырез задается парой')
    expect(html).toContain('Без поперечной арматуры')
    expect(html).toContain('С поперечной арматурой')
  })
})

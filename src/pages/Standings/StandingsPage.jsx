import { useState, useEffect } from 'react'
import PageLayout from '../../components/layout/PageLayout/PageLayout'
import styles from './StandingsPage.module.css'

// Mock data — se reemplaza cuando el endpoint de tabla de posiciones esté disponible
const MOCK_STANDINGS = [
  { pos: 1, team: 'Los Cuervos de Odin',  pj: 8, pg: 7, pe: 1, pp: 0, gf: 22, gc: 5,  dg: +17, pts: 22 },
  { pos: 2, team: 'Ratoneros FC',          pj: 8, pg: 6, pe: 0, pp: 2, gf: 18, gc: 9,  dg: +9,  pts: 18 },
  { pos: 3, team: 'Ingenieros United',     pj: 8, pg: 5, pe: 1, pp: 2, gf: 15, gc: 10, dg: +5,  pts: 16 },
  { pos: 4, team: 'Debug Squad',           pj: 8, pg: 4, pe: 2, pp: 2, gf: 13, gc: 11, dg: +2,  pts: 14 },
  { pos: 5, team: 'Null Pointer FC',       pj: 8, pg: 4, pe: 0, pp: 4, gf: 12, gc: 15, dg: -3,  pts: 12 },
  { pos: 6, team: 'Stack Overflow SC',     pj: 8, pg: 3, pe: 1, pp: 4, gf: 10, gc: 14, dg: -4,  pts: 10 },
  { pos: 7, team: 'Runtime Errors',        pj: 8, pg: 2, pe: 2, pp: 4, gf: 9,  gc: 16, dg: -7,  pts: 8  },
  { pos: 8, team: 'Loop Forever FC',       pj: 8, pg: 1, pe: 1, pp: 6, gf: 7,  gc: 21, dg: -14, pts: 4  },
]

export default function StandingsPage() {
  const [standings] = useState(MOCK_STANDINGS)

  const getRowClass = (pos) => {
    if (pos === 1) return styles.rowGold
    if (pos <= 4) return styles.rowTop
    return pos % 2 === 0 ? styles.rowAlt : styles.rowNormal
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Tabla de posiciones</h1>
        <p className={styles.sub}>Temporada 2026 — TechCupFútbol</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th>Pos</th>
              <th className={styles.teamCol}>Equipo</th>
              <th>PJ</th>
              <th>PG</th>
              <th>PE</th>
              <th>PP</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th className={styles.pts}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.pos} className={getRowClass(row.pos)}>
                <td className={styles.pos}>
                  {row.pos === 1 ? '🏆' : row.pos}
                </td>
                <td className={styles.teamName}>{row.team}</td>
                <td>{row.pj}</td>
                <td>{row.pg}</td>
                <td>{row.pe}</td>
                <td>{row.pp}</td>
                <td>{row.gf}</td>
                <td>{row.gc}</td>
                <td>{row.dg > 0 ? `+${row.dg}` : row.dg}</td>
                <td className={styles.pts}>{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>
        <span className={styles.legendGold}>■</span> Campeón &nbsp;
        <span className={styles.legendTop}>■</span> Zona de honor
      </p>
    </PageLayout>
  )
}

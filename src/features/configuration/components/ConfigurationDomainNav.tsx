import { NavLink } from 'react-router-dom'
import { CONFIG_NAV } from '@/features/configuration/constants'

export function ConfigurationDomainNav() {
  return (
    <nav className="config-domain-nav" aria-label="Configuration domains">
      <ul className="config-domain-nav__list">
        {CONFIG_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'config-domain-nav__link is-active' : 'config-domain-nav__link'
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

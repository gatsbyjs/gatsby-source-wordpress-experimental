import { graphql, Link, useStaticQuery } from "gatsby"
import React from "react"

export default function Menu() {
  const { wpMenu } = useStaticQuery(graphql`
    query {
      wpMenu(locations: { eq: GATSBY_HEADER_MENU }) {
        id
        name
        menuItems {
          nodes {
            label
            url
          }
        }
      }
    }
  `)

  if (!wpMenu?.menuItems?.nodes.length) {
    return null
  }

  return (
    <nav>
      {wpMenu.menuItems?.nodes?.map(menuItem => (
        <>
          <Link to={menuItem.url} key={menuItem.url}>
            {menuItem.label}
          </Link>
          <br />
        </>
      ))}
    </nav>
  )
}

import { Dictionary } from '@/i18n/getDictionary'
import React from 'react'
import ThemeToggle from '../reusable/ThemeToggle'
import LangToggle from '../reusable/LangToggle'

const Hero = ({
  dict
} : {
  dict: Dictionary['marketing']['home']
}) => {

  const homeData = dict.hero

  return (
    <div>
      {homeData.title}
    </div>
  )
}

export default Hero
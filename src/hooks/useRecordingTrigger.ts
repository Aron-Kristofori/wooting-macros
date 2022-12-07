import { invoke } from '@tauri-apps/api/tauri'
import { useCallback, useEffect, useState } from 'react'
import { KeyType, MouseButton } from '../enums'
import { webCodeHIDLookup } from '../maps/HIDmap'
import { webButtonLookup } from '../maps/MouseMap'
import { Keypress, TriggerTypes } from '../types'
import { isKeypressArray } from '../utils'

export default function useRecordingTrigger() {
  const [recording, setRecording] = useState(false)
  const [items, setItems] = useState<TriggerTypes>([])
  const [prevItems, setPrevItems] = useState<TriggerTypes>([])

  const resetItems = useCallback(() => {
    setItems(prevItems)
  }, [setItems, prevItems])

  const initItems = useCallback(
    (newItems: TriggerTypes) => {
      setItems(newItems)
    },
    [setItems]
  )

  const startRecording = useCallback(() => {
    setPrevItems(items)
    setItems([])
    setRecording(true)
  }, [setPrevItems, setItems, setRecording, items])

  const stopRecording = useCallback(() => {
    setRecording(false)
  }, [setRecording])

  const addKeypress = useCallback(
    // limitation: either up to 4 keys or 1 mouse button can be set as the trigger
    // when recording the macro if the user presses a non-modifer key, recording ends
    // if the user presses a mouse button, recording ends
    // if a user presses a modifier key, recording continues, until they press a non-modifer (finishes the keypress[]) or a mouse button (overwrites the keypress[])
    (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const HIDcode = webCodeHIDLookup.get(event.code)?.HIDcode
      if (HIDcode === undefined) {
        return
      }

      const keypress: Keypress = {
        keypress: HIDcode,
        press_duration: 0,
        keytype: KeyType[KeyType.DownUp]
      }

      setItems((items: Keypress[] | MouseButton[]) => {
        let newItems = []
        if (isKeypressArray(items)) {
          newItems = [...items, keypress]
        } else {
          newItems = [keypress]
        }
        return newItems
      })

      if (HIDcode < 224) {
        // handle cutting off at alphanumeric key here
        // this condition can be changed in the future, if we would like to increase the amount of "modifier keys"
        stopRecording()
      }
    },
    [stopRecording]
  )

  const addMousepress = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (
        (event.target as HTMLElement).localName === 'button' ||
        (event.target as HTMLElement).localName === 'svg' ||
        (event.target as HTMLElement).localName === 'path'
      ) {
        return
      }

      const enumVal = webButtonLookup.get(event.button)?.enumVal
      if (enumVal === undefined) {
        return
      }

      setItems([enumVal])
      stopRecording()
    },
    [setItems, stopRecording]
  )

  useEffect(() => {
    if (!recording) {
      return
    }

    window.addEventListener('keydown', addKeypress, true)
    window.addEventListener('mousedown', addMousepress, true)
    invoke<void>('control_grabbing', { frontendBool: false }).catch((e) => {
      console.error(e)
    })

    return () => {
      window.removeEventListener('keydown', addKeypress, true)
      window.removeEventListener('mousedown', addMousepress, true)
      invoke<void>('control_grabbing', { frontendBool: true }).catch((e) => {
        console.error(e)
      })
    }
  }, [recording, addKeypress, addMousepress])

  return {
    recording,
    startRecording,
    stopRecording,
    items,
    resetItems,
    initItems
  }
}
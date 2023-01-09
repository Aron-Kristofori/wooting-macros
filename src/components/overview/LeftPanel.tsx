import { AddIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  VStack,
  Divider,
  Button,
  HStack,
  Text,
  useColorModeValue,
  Tooltip,
  Switch,
  useToast,
  Box,
  useColorMode
} from '@chakra-ui/react'
import { Collection } from '../../types'
import { useApplicationContext } from '../../contexts/applicationContext'
import {
  scrollbarsStylesDark,
  scrollbarStylesLight
} from '../../constants/utils'
import CollectionButton from './CollectionButton'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { invoke } from '@tauri-apps/api'
import { useCallback, useState } from 'react'
import data from '@emoji-mart/data'

type Props = {
  onOpenSettingsModal: () => void
}

export default function LeftPanel({ onOpenSettingsModal }: Props) {
  const {
    collections,
    selection,
    onCollectionAdd,
    onCollectionUpdate,
    changeSelectedCollectionIndex
  } = useApplicationContext()
  const [parent] = useAutoAnimate<HTMLDivElement>()
  const toast = useToast()
  const [isMacroOutputEnabled, setIsMacroOutputEnabled] = useState(true)
  const { colorMode } = useColorMode()
  const panelBg = useColorModeValue('bg-light', 'primary-dark.900')
  const borderColour = useColorModeValue(
    'primary-light.100',
    'primary-dark.700'
  )

  const onNewCollectionButtonPress = useCallback(() => {
    const randomCategory =
      data.categories[Math.floor(Math.random() * (6 - 1 + 1) + 1)]
    console.log(randomCategory)
    let randomEmoji =
      randomCategory.emojis[
        Math.floor(Math.random() * randomCategory.emojis.length)
      ]
    if (randomEmoji.includes('flag') || randomEmoji.includes('symbols')) {
      randomEmoji = 'smile'
    }

    onCollectionAdd({
      active: true,
      icon: `:${randomEmoji}:`,
      macros: [],
      name: `Collection ${collections.length + 1}`
    })
  }, [collections.length, onCollectionAdd])

  return (
    <VStack
      bg={panelBg}
      h="100vh"
      p={4}
      w={'300px'}
      borderRight="1px"
      borderColor={borderColour}
      justifyContent="space-between"
    >
      <VStack w="full" h="full" pt={1} overflow="hidden" gap={2}>
        <HStack w="full" justifyContent="space-between" px={1}>
          <Text w="full" fontWeight="bold" fontSize={'28px'}>
            Collections
          </Text>
          <Tooltip
            hasArrow
            label={
              isMacroOutputEnabled
                ? 'Disable Macro Output'
                : 'Enable Macro Output'
            }
            closeOnClick={false}
            aria-label="Toggle Macro Output button description"
            rounded="sm"
            variant="brand"
          >
            <Box>
              <Switch
                size="sm"
                variant="brand"
                defaultChecked={isMacroOutputEnabled}
                isChecked={isMacroOutputEnabled}
                onChange={() => {
                  setIsMacroOutputEnabled((value) => {
                    invoke<void>('control_grabbing', {
                      frontendBool: !value
                    }).catch((e) => {
                      console.error(e)
                      toast({
                        title: `Error ${
                          !value ? 'disabling' : 'enabling'
                        } macro output`,
                        description: `Unable to ${
                          !value ? 'disable' : 'enable'
                        } macro output, please re-open the app.`,
                        status: 'error',
                        duration: 2000,
                        isClosable: true
                      })
                    })
                    return !value
                  })
                }}
              />
            </Box>
          </Tooltip>
        </HStack>
        <Divider />
        <Button
          size="lg"
          w="full"
          variant="yellowGradient"
          p={2}
          leftIcon={<AddIcon />}
          onClick={onNewCollectionButtonPress}
        >
          New Collection
        </Button>
        <VStack
          w="full"
          h="full"
          overflowX="hidden"
          overflowY="auto"
          ref={parent}
          spacing={1}
          sx={
            colorMode === 'light' ? scrollbarStylesLight : scrollbarsStylesDark
          }
        >
          {collections.map((collection: Collection, index: number) => (
            <CollectionButton
              collection={collection}
              index={index}
              key={`${collection.name} + ${index}`}
              isFocused={index == selection.collectionIndex}
              isMacroOutputEnabled={isMacroOutputEnabled}
              setFocus={(index) => changeSelectedCollectionIndex(index)}
              toggleCollection={() =>
                onCollectionUpdate(
                  {
                    ...collections[index],
                    active: !collections[index].active
                  },
                  index
                )
              }
            />
          ))}
        </VStack>
      </VStack>
      <HStack w="full">
        <Button
          w="full"
          variant="brandAccent"
          size="sm"
          leftIcon={<SettingsIcon />}
          onClick={onOpenSettingsModal}
        >
          <Text fontSize={['sm', 'md']}>Settings</Text>
        </Button>
      </HStack>
    </VStack>
  )
}

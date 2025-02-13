import {
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Stack,
  useDisclosure,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { DeleteIcon, SettingsIcon, TimeIcon } from '@chakra-ui/icons'
import { useCallback } from 'react'
import { Keypress, MousePressAction } from '../../../types'
import { useMacroContext } from '../../../contexts/macroContext'
import useRecordingSequence from '../../../hooks/useRecordingSequence'
import { useSettingsContext } from '../../../contexts/settingsContext'
import { KeyType } from '../../../constants/enums'
import { checkIfKeypress, checkIfMouseButton } from '../../../constants/utils'
import ClearSequenceModal from './ClearSequenceModal'
import { RecordIcon, StopIcon } from '../../icons'
import SortableList from './SortableList'

interface Props {
  onOpenSettingsModal: () => void
}

export default function SequencingArea({ onOpenSettingsModal }: Props) {
  const {
    sequence,
    willCauseTriggerLooping,
    onElementAdd,
    onElementsAdd,
    updateElement
  } = useMacroContext()
  const { config } = useSettingsContext()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const onItemChanged = useCallback(
    (
      item: Keypress | MousePressAction | undefined,
      prevItem: Keypress | MousePressAction | undefined,
      timeDiff: number,
      isUpEvent: boolean
    ) => {
      if (item === undefined) {
        return
      }
      // If necessary, adjust previous element.
      if (isUpEvent && prevItem !== undefined) {
        if (checkIfKeypress(prevItem) && checkIfKeypress(item)) {
          if (prevItem.keypress === item.keypress) {
            updateElement(
              {
                type: 'KeyPressEventAction',
                data: {
                  ...prevItem,
                  keytype: KeyType[KeyType.DownUp],
                  press_duration: timeDiff
                }
              },
              sequence.length - 1
            )
            return
          }
        } else if (checkIfMouseButton(prevItem) && checkIfMouseButton(item)) {
          if (prevItem.button === item.button) {
            updateElement(
              {
                type: 'MouseEventAction',
                data: {
                  type: 'Press',
                  data: { ...prevItem, type: 'DownUp', duration: timeDiff }
                }
              },
              sequence.length - 1
            )
            return
          }
        }
      }
      // Add elements to the sequence. If there is no previous item, the item we are adding is the first one, thus we do not include a delay element.
      if (prevItem === undefined) {
        if (checkIfKeypress(item)) {
          onElementAdd({
            type: 'KeyPressEventAction',
            data: item
          })
        } else {
          onElementAdd({
            type: 'MouseEventAction',
            data: { type: 'Press', data: item }
          })
        }
      } else {
        if (checkIfKeypress(item)) {
          onElementsAdd([
            {
              type: 'DelayEventAction',
              data: timeDiff
            },
            {
              type: 'KeyPressEventAction',
              data: item
            }
          ])
        } else {
          onElementsAdd([
            {
              type: 'DelayEventAction',
              data: timeDiff
            },
            {
              type: 'MouseEventAction',
              data: { type: 'Press', data: item }
            }
          ])
        }
      }
    },
    [onElementAdd, onElementsAdd, sequence.length, updateElement]
  )

  const { recording, startRecording, stopRecording } =
    useRecordingSequence(onItemChanged)

  return (
    <VStack w="41%" h="full">
      {/** Header */}
      <VStack w="full" px={[2, 4, 6]} pt={[2, 4]}>
        <Stack
          direction={['column', 'row']}
          w="full"
          textAlign="left"
          justifyContent="space-between"
          alignItems={['start', 'center']}
        >
          <Text fontWeight="semibold" fontSize={['sm', 'md']}>
            Sequence
          </Text>
          {willCauseTriggerLooping && (
            <Alert
              status="error"
              w={['full', 'fit']}
              rounded="md"
              py="1"
              px={['2', '3']}
            >
              <AlertIcon boxSize={['16px', '20px']} />
              <AlertDescription fontSize={['xs', 'sm']} fontWeight="bold">
                1+ elements may trigger this macro again or another macro!
              </AlertDescription>
            </Alert>
          )}
        </Stack>
      </VStack>
      <HStack
        justifyContent="right"
        w="full"
        alignItems="center"
        px={[2, 4, 6]}
      >
        <Button
          variant="brandRecord"
          leftIcon={recording ? <StopIcon /> : <RecordIcon />}
          size={['xs', 'sm', 'md']}
          isActive={recording}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? 'Stop' : 'Record'}
        </Button>
        <Button
          variant="brandWarning"
          leftIcon={<DeleteIcon />}
          size={['xs', 'sm', 'md']}
          onClick={onOpen}
          isDisabled={sequence.length === 0}
        >
          Clear All
        </Button>
        <Button
          variant="brandAccent"
          leftIcon={<TimeIcon />}
          size={['xs', 'sm', 'md']}
          onClick={() => {
            onElementAdd({
              type: 'DelayEventAction',
              data: config.DefaultDelayValue
            })
          }}
        >
          Add Delay
        </Button>
        <Tooltip label="Open Application Settings" hasArrow variant="brand">
          <IconButton
            variant="brand"
            aria-label="Settings"
            icon={<SettingsIcon />}
            size={['xs', 'sm', 'md']}
            onClick={onOpenSettingsModal}
          />
        </Tooltip>
      </HStack>
      {/** Header End */}
      <ClearSequenceModal
        isOpen={isOpen}
        onClose={onClose}
        stopRecording={stopRecording}
      />
      <Divider w="full" />
      <SortableList recording={recording} stopRecording={stopRecording} />
    </VStack>
  )
}

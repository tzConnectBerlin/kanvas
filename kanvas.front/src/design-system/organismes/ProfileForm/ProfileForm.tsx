import * as yup from 'yup'
import Scroll from 'react-scroll'
import styled from '@emotion/styled'
import Avatar from '../../atoms/Avatar'
import CustomButton from '../../atoms/Button'
import Typography from '../../atoms/Typography'
import FlexSpacer from '../../atoms/FlexSpacer'
import CustomCircularProgress from '../../atoms/CircularProgress'

import { useFormik } from 'formik'
import { FC, useEffect, useState } from 'react'
import { ClearRounded } from '@mui/icons-material'
import { DropZone } from '../../molecules/DropZone'
import { Theme } from '@mui/material'
import { Box, TextField, InputAdornment, Stack } from '@mui/material'

interface ProfileFormProps {
  initialValues: any
  submit: Function
  loading: boolean
}

const StyledStack = styled(Stack)`
  width: 55%;

  transition: all 0.2s;

  .MuiTextField-root {
    width: 100% !important;
  }

  @media (max-width: 1100px) {
    width: 80%;
  }

  @media (max-width: 650px) {
    width: 100%;
  }
`

const StyledInput = styled(TextField)<{ theme?: Theme }>`
  .MuiInput-input {
    padding: 4px 0 8px !important;
  }

  .MuiInput-root:after {
    border-bottom: 2px solid
      ${(props) => props.theme.palette.primary.contrastText};
  }

  .MuiFormHelperText-root {
    font-family: 'Poppins Medium';
    font-size: 0.9rem;
    margin-top: 2.5rem !important;

    position: absolute;
  }
`

const StyledAvataWrapper = styled.div`
  position: relative;
`

const ClearContentWrapper = styled.div<{ theme?: Theme }>`
  height: 2rem;
  width: 2rem;

  border-radius: 1rem;
  position: absolute;
  right: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 5;

  background-color: ${(props) => props.theme.palette.background.default};

  margin-right: 0.5rem;
  margin-top: 0.5 rem;

  filter: ${(props) => props.theme.dropShadow.default};
  transition: filter 0.2s;

  cursor: pointer;

  :hover {
    transition: filter 0.2s;
    filter: ${(props) => props.theme.dropShadow.hover};
  }

  :active {
    filter: drop-shadow(0px 0px 6px #98989833);
  }
`

const StyledClearContent = styled(ClearRounded)<{ theme?: Theme }>`
  color: ${(props) => props.theme.palette.text.primary};
`

const validationSchema = yup.object({
  userName: yup
    .string()
    .min(3, 'Username must be at least 3 characters length'),
})

let Element = Scroll.Element

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding-left: 2rem;
  padding-right: 2rem;
`

export const ProfileForm: FC<ProfileFormProps> = ({ ...props }) => {
  const [profilePicture, setProfilePicture] = useState('')
  const [profilePictureFile, setProfilePictureFile] =
    useState<unknown>(undefined)
  const [isUserNameValid, setIsUserNameValid] = useState(true)
  const [dropZoneErrorMessage, setDropZoneErrorMessage] = useState<
    string | null
  >(null)

  // const [checkIfUsernameValid, userNameCheckResponse] = useLazyQuery(CHECK_IF_USERNAME_VALID)

  const dataURLtoFile = (dataurl: any, filename: any) => {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mime })
  }

  const formik = useFormik({
    initialValues: props.initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      props.submit({
        variables: {
          ...values,
          profilePicture: dataURLtoFile(
            JSON.parse(sessionStorage.getItem('profilePicture')!).blob,
            'profilePicture',
          ),
        },
      })
    },
  })

  const scrollTo = (id: string) => {
    Scroll.scroller.scrollTo(id, {
      duration: 500,
      delay: 0,
      smooth: true,
      offset: -550,
    })
  }

  // useEffect for profilepicture initial values in case of refresh
  useEffect(() => {
    if (sessionStorage.getItem('profilePicture') !== null) {
      try {
        const blobJson = JSON.parse(sessionStorage.getItem('profilePicture')!)

        if ('blob' in blobJson) {
          setProfilePicture(blobJson.blob)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }, [])

  // useEffect for username verification
  useEffect(() => {
    // if (formik.values.userName.length >= 3) {
    //     userNameCheckResponse.loading = true
    //     const delayUserNameAvailabilitySearch = setTimeout(() => {
    //         checkIfUsernameValid({ variables: { userName: formik.values.userName}})
    //     }, 800)
    //     return () => { clearTimeout(delayUserNameAvailabilitySearch) }
    // }
  }, [formik.values.userName])

  // useEffect(() => {

  //     if (userNameCheckResponse.data) {
  //         setIsUserNameValid(userNameCheckResponse.data.checkIfUsernameValid)
  //     }

  // }, [userNameCheckResponse.data])

  return (
    <Box component="form" autoComplete="off">
      <StyledForm onSubmit={formik.handleSubmit}>
        <FlexSpacer minHeight={4} />

        <StyledStack direction="column" spacing={4}>
          <Typography size="h3" weight="Medium">
            {' '}
            Upload your photo{' '}
          </Typography>
          <Element
            name="profilePicture"
            onFocus={() => scrollTo('profilePicture')}
          >
            <Stack direction="row" spacing={8}>
              {formik.values.profilePicture ? (
                <StyledAvataWrapper>
                  <ClearContentWrapper
                    onClick={() => formik.setFieldValue('profilePicture', '')}
                  >
                    <StyledClearContent />
                  </ClearContentWrapper>
                  <Avatar
                    src={formik.values.profilePicture}
                    height={176}
                    width={176}
                  />
                </StyledAvataWrapper>
              ) : undefined}
              <DropZone
                inputId="profilePicture"
                fileUrl={profilePicture}
                setFileUrl={setProfilePicture}
                setDropZoneErrorMessage={setDropZoneErrorMessage}
                error={dropZoneErrorMessage ? true : false}
              />
            </Stack>
          </Element>
        </StyledStack>
        <FlexSpacer minHeight={1} />

        <Typography size="body1" weight="Light" color="error">
          {' '}
          {dropZoneErrorMessage}{' '}
        </Typography>

        <FlexSpacer minHeight={4} />

        <StyledStack direction="column" spacing={4}>
          <Typography size="h3" weight="Medium">
            {' '}
            Enter a username*{' '}
          </Typography>
          <Element name="userName">
            <StyledInput
              id="userName"
              name="userName"
              placeholder="Type Here"
              onFocus={() => scrollTo('userName')}
              onBlur={formik.handleBlur}
              onChange={(event) => {
                formik.handleChange(event)
                sessionStorage.setItem('userName', event.currentTarget.value)
              }}
              variant="standard"
              InputProps={{
                // userNameCheckResponse.loading
                endAdornment: (
                  <InputAdornment position="start">
                    {' '}
                    {false ? <CustomCircularProgress height={1} /> : null}{' '}
                  </InputAdornment>
                ),
              }}
              error={
                (formik.touched.userName && Boolean(formik.errors.userName)) ||
                !isUserNameValid
              }
              helperText={
                (formik.touched.userName && formik.errors.userName) ||
                (!isUserNameValid ? 'Username already taken' : '')
              }
              value={formik.values.userName}
            />
          </Element>
        </StyledStack>

        <FlexSpacer minHeight={4} />

        <CustomButton
          size="medium"
          onClick={() => formik.handleSubmit()}
          label={'Save'}
          sx={{ width: '10rem' }}
          loading={props.loading}
        />

        <FlexSpacer minHeight={5} />
      </StyledForm>
    </Box>
  )
}

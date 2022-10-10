import { FC, useEffect, useState } from 'react';
import { Record, useNotify } from 'react-admin';
import axios from 'axios';
import { Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import { InputSelectorProps } from './types';
import { renderContent } from '../renderContent';

export const FieldSelector: FC<InputSelectorProps> = ({ ...props }) => {
  const notify = useNotify();

  const [voters, setVoters] = useState<Record[]>([]);
  const [votersCalled, setVotersCalled] = useState<boolean>(false);

  const getVoters = () => {
    const instantVoters: any[] = [];
    props.record.proposal_vote?.yes
      ?.concat(props.record.proposal_vote.no)
      .map(async (id: number) => {
        const res = await axios.get(
          process.env.REACT_APP_API_SERVER_BASE_URL + `/user/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                'KanvasAdmin - Bearer',
              )}`,
            },
          },
        );
        if (res.data.error === 400) return notify(res.data.error?.message);
        instantVoters.push(res.data);
      });
    setVoters(instantVoters);
  };

  useEffect(() => {
    if (props.type !== 'votes') return;
    if (voters.length > 0 || votersCalled) return;
    setVotersCalled(true);
    getVoters();
  }, []);

  if (!props.record || !props.type) return null;

  if (
    props.type === 'string' ||
    props.type === 'number' ||
    props.type === 'text'
  ) {
    return (
      <Stack direction="column">
        <Typography
          variant="subtitle2"
          style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}
        >
          {props.label}
        </Typography>
        <Typography
          variant="body2"
          style={{
            fontFamily: 'Poppins Medium',
            marginLeft: '1em',
            marginBottom: '1em',
            marginTop: '0.5em',
          }}
        >
          {props.record[props.attributesName]}
        </Typography>
      </Stack>
    );
  }
  if (props.type === 'date') {
    return (
      <Stack direction="column">
        <Typography
          variant="subtitle2"
          style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}
        >
          {props.label}
        </Typography>
        <Typography
          variant="body2"
          style={{
            fontFamily: 'Poppins Medium',
            marginLeft: '1em',
            marginBottom: '1em',
            marginTop: '0.5em',
          }}
        >
          {format(new Date(props.record[props.attributesName]), 'PPP')}
        </Typography>
      </Stack>
    );
  }
  if (props.type === 'number[]') {
    return (
      <Stack direction="row">
        <Stack direction="column">
          <Typography
            variant="subtitle2"
            style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}
          >
            {props.label}
          </Typography>
          <Typography
            variant="body2"
            style={{
              fontFamily: 'Poppins Medium',
              marginLeft: '1em',
              marginBottom: '1em',
              marginTop: '0.5em',
            }}
          >
            {props.numberValueArray?.map((value: string) =>
              value ? `${value}, ` : '',
            )}
          </Typography>
        </Stack>
      </Stack>
    );
  }
  if (props.type === 'votes') {
    return (
      <Stack direction="column">
        <Typography
          variant="subtitle2"
          style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}
        >
          {props.label}
        </Typography>
        <Stack direction="row">
          <Typography
            variant="body2"
            style={{
              fontFamily: 'Poppins Medium',
              marginLeft: '1em',
              marginBottom: '1em',
              marginTop: '0.5em',
            }}
          >
            <Typography
              variant="subtitle2"
              style={{ fontFamily: 'Poppins SemiBold' }}
            >
              Accepted:
            </Typography>
            {props.record[props.attributesName] &&
              props.record[props.attributesName] !== null &&
              props.record[props.attributesName]['yes'].map(
                (id: number, index: number) =>
                  voters.map((voter) => {
                    if (voter.id === id) {
                      return index ===
                        props.record[props.attributesName]['yes'].length - 1
                        ? `${voter.userName}`
                        : `${voter.userName}, `;
                    }
                  }),
              )}
          </Typography>
        </Stack>
        <Stack direction="row">
          <Typography
            variant="body2"
            style={{
              fontFamily: 'Poppins Medium',
              marginLeft: '1em',
              marginBottom: '1em',
              marginTop: '0.5em',
            }}
          >
            <Typography
              variant="subtitle2"
              style={{ fontFamily: 'Poppins SemiBold' }}
            >
              Rejected:
            </Typography>
            {props.record[props.attributesName] &&
              props.record[props.attributesName] !== null &&
              props.record[props.attributesName]['no'].map(
                (id: number, index: number) =>
                  voters.map((voter) => {
                    if (voter.id === id) {
                      return index ===
                        props.record[props.attributesName]['no'].length - 1
                        ? `${voter.userName}`
                        : `${voter.userName}, `;
                    }
                  }),
              )}
          </Typography>
        </Stack>
      </Stack>
    );
  }

  if (props.type === 'content_uri' && props.attributesName !== 'artifact') {
    return (
      <Stack direction="column">
        <Typography
          variant="subtitle2"
          style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}
        >
          {props.label}
        </Typography>
        {renderContent('100px', '100px', props.record[props.attributesName])}
      </Stack>
    );
  } else return null;
};

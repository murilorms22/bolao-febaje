do $$
declare
  round_id_value uuid;
  home_team_id_value uuid;
  away_team_id_value uuid;
  next_sort_order integer;
  fixture text[];
  fixtures text[][] := array[
    array['Tchéquia','África do Sul'],
    array['Suíça','Bósnia'],
    array['Canadá','Catar'],
    array['México','Coreia do Sul'],
    array['EUA','Austrália'],
    array['Escócia','Marrocos'],
    array['Brasil','Haiti'],
    array['Turquia','Paraguai'],
    array['Holanda','Suécia'],
    array['Alemanha','Costa do Marfim'],
    array['Equador','Curaçao'],
    array['Tunísia','Japão'],
    array['Espanha','Arábia Saudita'],
    array['Bélgica','Irã'],
    array['Uruguai','Cabo Verde'],
    array['Nova Zelândia','Egito'],
    array['Argentina','Áustria'],
    array['França','Iraque'],
    array['Noruega','Senegal'],
    array['Jordânia','Argélia'],
    array['Portugal','Uzbequistão'],
    array['Inglaterra','Gana'],
    array['Panamá','Croácia'],
    array['Colômbia','RD Congo']
  ];
begin
  insert into public.teams (name, fifa_code, iso_code, flag_url)
  values
    ('Tchéquia', 'CZE', 'cz', 'https://flagcdn.com/w80/cz.png'),
    ('África do Sul', 'RSA', 'za', 'https://flagcdn.com/w80/za.png'),
    ('Suíça', 'SUI', 'ch', 'https://flagcdn.com/w80/ch.png'),
    ('Bósnia', 'BIH', 'ba', 'https://flagcdn.com/w80/ba.png'),
    ('Canadá', 'CAN', 'ca', 'https://flagcdn.com/w80/ca.png'),
    ('Catar', 'QAT', 'qa', 'https://flagcdn.com/w80/qa.png'),
    ('México', 'MEX', 'mx', 'https://flagcdn.com/w80/mx.png'),
    ('Coreia do Sul', 'KOR', 'kr', 'https://flagcdn.com/w80/kr.png'),
    ('EUA', 'USA', 'us', 'https://flagcdn.com/w80/us.png'),
    ('Austrália', 'AUS', 'au', 'https://flagcdn.com/w80/au.png'),
    ('Escócia', 'SCO', 'gb-sct', 'https://flagcdn.com/w80/gb-sct.png'),
    ('Marrocos', 'MAR', 'ma', 'https://flagcdn.com/w80/ma.png'),
    ('Brasil', 'BRA', 'br', 'https://flagcdn.com/w80/br.png'),
    ('Haiti', 'HAI', 'ht', 'https://flagcdn.com/w80/ht.png'),
    ('Turquia', 'TUR', 'tr', 'https://flagcdn.com/w80/tr.png'),
    ('Paraguai', 'PAR', 'py', 'https://flagcdn.com/w80/py.png'),
    ('Holanda', 'NED', 'nl', 'https://flagcdn.com/w80/nl.png'),
    ('Suécia', 'SWE', 'se', 'https://flagcdn.com/w80/se.png'),
    ('Alemanha', 'GER', 'de', 'https://flagcdn.com/w80/de.png'),
    ('Costa do Marfim', 'CIV', 'ci', 'https://flagcdn.com/w80/ci.png'),
    ('Equador', 'ECU', 'ec', 'https://flagcdn.com/w80/ec.png'),
    ('Curaçao', 'CUW', 'cw', 'https://flagcdn.com/w80/cw.png'),
    ('Tunísia', 'TUN', 'tn', 'https://flagcdn.com/w80/tn.png'),
    ('Japão', 'JPN', 'jp', 'https://flagcdn.com/w80/jp.png'),
    ('Espanha', 'ESP', 'es', 'https://flagcdn.com/w80/es.png'),
    ('Arábia Saudita', 'KSA', 'sa', 'https://flagcdn.com/w80/sa.png'),
    ('Bélgica', 'BEL', 'be', 'https://flagcdn.com/w80/be.png'),
    ('Irã', 'IRN', 'ir', 'https://flagcdn.com/w80/ir.png'),
    ('Uruguai', 'URU', 'uy', 'https://flagcdn.com/w80/uy.png'),
    ('Cabo Verde', 'CPV', 'cv', 'https://flagcdn.com/w80/cv.png'),
    ('Nova Zelândia', 'NZL', 'nz', 'https://flagcdn.com/w80/nz.png'),
    ('Egito', 'EGY', 'eg', 'https://flagcdn.com/w80/eg.png'),
    ('Argentina', 'ARG', 'ar', 'https://flagcdn.com/w80/ar.png'),
    ('Áustria', 'AUT', 'at', 'https://flagcdn.com/w80/at.png'),
    ('França', 'FRA', 'fr', 'https://flagcdn.com/w80/fr.png'),
    ('Iraque', 'IRQ', 'iq', 'https://flagcdn.com/w80/iq.png'),
    ('Noruega', 'NOR', 'no', 'https://flagcdn.com/w80/no.png'),
    ('Senegal', 'SEN', 'sn', 'https://flagcdn.com/w80/sn.png'),
    ('Jordânia', 'JOR', 'jo', 'https://flagcdn.com/w80/jo.png'),
    ('Argélia', 'ALG', 'dz', 'https://flagcdn.com/w80/dz.png'),
    ('Portugal', 'POR', 'pt', 'https://flagcdn.com/w80/pt.png'),
    ('Uzbequistão', 'UZB', 'uz', 'https://flagcdn.com/w80/uz.png'),
    ('Inglaterra', 'ENG', 'gb-eng', 'https://flagcdn.com/w80/gb-eng.png'),
    ('Gana', 'GHA', 'gh', 'https://flagcdn.com/w80/gh.png'),
    ('Panamá', 'PAN', 'pa', 'https://flagcdn.com/w80/pa.png'),
    ('Croácia', 'CRO', 'hr', 'https://flagcdn.com/w80/hr.png'),
    ('Colômbia', 'COL', 'co', 'https://flagcdn.com/w80/co.png'),
    ('RD Congo', 'COD', 'cd', 'https://flagcdn.com/w80/cd.png')
  on conflict (fifa_code) do update
  set
    name = excluded.name,
    iso_code = excluded.iso_code,
    flag_url = excluded.flag_url;

  select id
  into round_id_value
  from public.rounds
  where name = 'Fase de Grupos - Rodada 2'
  limit 1;

  if round_id_value is null then
    select coalesce(max(sort_order), 0) + 1
    into next_sort_order
    from public.rounds;

    insert into public.rounds (
      name,
      sort_order,
      weight,
      phase,
      round_number,
      starts_at,
      prediction_deadline
    )
    values (
      'Fase de Grupos - Rodada 2',
      next_sort_order,
      1,
      'group_stage',
      2,
      '2026-06-18 13:00:00-03'::timestamptz,
      '2026-06-18 12:59:00-03'::timestamptz
    )
    returning id into round_id_value;
  else
    update public.rounds
    set
      phase = 'group_stage',
      round_number = 2,
      starts_at = coalesce(starts_at, '2026-06-18 13:00:00-03'::timestamptz),
      prediction_deadline = coalesce(prediction_deadline, '2026-06-18 12:59:00-03'::timestamptz)
    where id = round_id_value;
  end if;

  foreach fixture slice 1 in array fixtures loop
    select id into home_team_id_value from public.teams where name = fixture[1] limit 1;
    select id into away_team_id_value from public.teams where name = fixture[2] limit 1;

    if home_team_id_value is not null and away_team_id_value is not null then
      insert into public.matches (
        round_id,
        home_team_id,
        away_team_id,
        match_at,
        status,
        phase,
        weight,
        result_confirmed
      )
      select
        round_id_value,
        home_team_id_value,
        away_team_id_value,
        '2026-06-18 13:00:00-03'::timestamptz,
        'scheduled',
        'group_stage',
        1,
        false
      where not exists (
        select 1
        from public.matches
        where round_id = round_id_value
          and home_team_id = home_team_id_value
          and away_team_id = away_team_id_value
      );
    end if;
  end loop;
end $$;
